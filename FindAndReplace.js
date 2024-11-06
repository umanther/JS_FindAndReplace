let farPair = (function() {
    // Returns a utility function to assist with pair formatting.
    // Used by calling: farPair.set(/<regex statement>/g, '<replace string>')
    // Returns a formatted dictionary that can be passed to findAndReplace() as a filter.

    function set(regex, replace) {
        return {
            regex: regex,
            replace: replace
        };
    }

    return {
        set
    };
})();

function findAndReplace(watch, filters) {
    'use strict';
    // Create a mutation observer to apply 'filters' to 'watch'
    // watch: document node to watch
    // filters: regex/replace string pairs to find

    // If 'filters' is not an array, put it in an Array
    if (!(filters instanceof Array)) {
        filters = Array(filters);
    }

    let mutationObserver = new MutationObserver(mutations => {
        // Mutation observer anonymous function

        function deepText(node) {
            // Find all text nodes (nodeType=3) in 'node's children

            // Array to hold results
            var A = [];
            // If 'node' is not empty ...
            if (node) {
                // Move to firstChild of 'node'
                node = node.firstChild;
                // While 'node' is not empty ...
                while (node != null) {
                    // If 'node' is a text node, add it to the output
                    if (node.nodeType == 3) A.push(node);
                    // Test for children of 'node' and add results to output
                    else A = A.concat(deepText(node));
                    // Move to nextSibling of 'node'
                    node = node.nextSibling;
                }
            }
            // Return results
            return A;
        }

        function validateRegex(regex, target) {
            // Return true if 'regex' returns any results in 'target's text nodes, else return false
            // regex: a RegularExpression
            // target: the HTML node to test.  Can be any

            // Create a deep clone of 'target' to keep from deforming the page
            target = target.cloneNode(true);
            // Create a temporary div to hold 'target' if the target is a text node
            let temp = document.createElement('div');
            if (target.nodeType == 3) {
                temp.append(target);
                target = temp;
            }
            // Get the array of text nodes in 'target'
            let textToValidate = deepText(target);
            // Loop through text nodes and return 'true' if any 'regex' matches are found ...
            for (let text in textToValidate) {
                text = textToValidate[text];
                if ([...text.textContent.matchAll(regex)].length > 0) return true;
            }
            // else return 'false'
            return false;
        }

        let allText = deepText(watch);

        // Loop through all filters
        for (let filter in filters) {
            filter = filters[filter];

            // Check that 'filter.regex' and 'filter.replace' are the correct types, otherwise skip
            if (filter.regex instanceof RegExp === false || (typeof filter.replace === 'string' === false && typeof filter.replace === 'function' === false)) continue;

            // Isolate all text nodes in 'watch', filter only matches with 'filter.regex' and store as 'matches'
            let matches = allText.filter(item => validateRegex(filter.regex, item));

            // Loop through all matches ...
            for (let match in matches) {
                match = matches[match];

                // Create temporary 'div' to make changes to
                let temp = document.createElement('div');
                // Make 'regex' changes
                temp.innerHTML = match.data.replaceAll(filter.regex, filter.replace);

                // Test resulting change to look for an infinite loop scenario
                if (validateRegex(filter.regex, temp)) {
                    console.log(`Infinite loop detected.  Aborting replace... \nBad filter:\n\t         Regex: ${filter.regex}\n\tReplace String: ${filter.replace}`);
                    return;
                }

                // Move child elements of temporary 'div' into the document at match location
                while (temp.firstChild) {
                    match.parentNode.insertBefore(temp.firstChild, match);
                }
                // Remove the original text node  !!! Failing to do this will create an infinite loop !!!
                match.remove();
            }
        }
    });

    // Create mutation observer to look at 'watch' for updates
    mutationObserver.observe(watch, {
        childList: true,
        subtree: true,
        characterData: true
    });

    // Kickstart the observer by creating an update event for static pages
    let ks = document.createElement('div');
    watch.append(ks);
    ks.remove();
}
